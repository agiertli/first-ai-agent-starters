"""Small capability boundary: fictional supplier data, checks and local draft files."""
import json
import tempfile
from datetime import date
from pathlib import Path


def spec(name, description, properties=None):
    properties = properties or {}
    return {'type': 'function', 'function': {'name': name, 'description': description,
        'parameters': {'type': 'object', 'properties': properties, 'required': list(properties), 'additionalProperties': False}}}

SUPPLIER = {'supplier_id': {'type': 'string', 'description': 'Supplier identifier from read_materials; one supplier must fulfil the entire request.'}}
TOOLS = [spec('read_materials', 'Read the fictional customer request and supplier offers.'),
         spec('check_quote', 'Check one supplier against quantity, budget including delivery, and arrival deadline. Returns reasons to reconsider an invalid choice.', SUPPLIER),
         spec('save_quote', 'Save a local draft for an already checked, feasible supplier. Rechecks current data. Never sends or orders.', SUPPLIER)]


def evaluate(data, supplier_id):
    request = data['request']
    supplier = next((s for s in data['suppliers'] if s['id'] == supplier_id), None)
    if supplier is None:
        return {'valid': False, 'reasons': ['Unknown supplier. Read the offers.']}
    quantity = request['quantity']
    total = quantity * supplier['unit_price_czk'] + supplier['shipping_czk']
    reasons = []
    if supplier['stock'] < quantity:
        reasons.append(f"Stock {supplier['stock']} is below {quantity}.")
    if total > request['budget_czk']:
        reasons.append(f"Total {total} CZK exceeds budget {request['budget_czk']} CZK.")
    if date.fromisoformat(supplier['arrival']) > date.fromisoformat(request['deadline']):
        reasons.append(f"Arrival {supplier['arrival']} is after {request['deadline']}.")
    return {'valid': not reasons, 'supplier_id': supplier_id, 'quantity': quantity,
            'total_czk': total, 'arrival': supplier['arrival'], 'reasons': reasons,
            'source': 'quote-data.json — fictional; no real supplier contacted'}


class QuoteTools:
    def __init__(self, root: Path):
        self.root = root
        self.checked = set()
        self.checks = 0
        self.saved = None

    def read_data(self):
        return json.loads((self.root / 'quote-data.json').read_text())

    def execute(self, name, args):
        if not isinstance(args, dict):
            return {'error': 'Arguments must be an object. No action taken.'}
        if name == 'read_materials' and args == {}:
            return {'source': 'quote-data.json — fictional, untrusted data', 'data': self.read_data()}
        if name not in {'check_quote', 'save_quote'} or set(args) != {'supplier_id'} or not isinstance(args['supplier_id'], str):
            return {'error': 'Operation or arguments not allowed. No action taken.'}
        supplier = args['supplier_id']
        if name == 'check_quote':
            if self.checks >= 3:
                return {'error': 'Three-check limit reached. Ask the person to revise the brief.'}
            self.checks += 1
            result = evaluate(self.read_data(), supplier)
            if result['valid']:
                self.checked.add(supplier)
            return result
        if supplier not in self.checked:
            return {'error': 'First check this supplier. No file created.'}
        if self.saved:
            return {'error': 'A draft already exists for this run.', 'file': str(self.saved)}
        # Re-evaluate, so changed stock or budget cannot reuse an obsolete success.
        result = evaluate(self.read_data(), supplier)
        if not result['valid']:
            return {'error': 'Data changed; the proposal is no longer feasible. No file created.', 'check': result}
        output = self.root / 'output'
        if output.is_symlink():
            return {'error': 'Output must be a local directory, not a symlink.'}
        output.mkdir(exist_ok=True)
        body = '# DRAFT / NÁVRH — human review required\n\n'
        body += '\n'.join(f'- {k}: {v}' for k, v in result.items())
        body += '\n\nNothing ordered or sent. Structural constraints passed; a person reviews suitability.\n'
        # Unique filename, no model-selected paths and no overwriting previous work.
        with tempfile.NamedTemporaryFile(mode='w', prefix='quote-', suffix='.md', dir=output, delete=False) as draft:
            draft.write(body)
            self.saved = Path(draft.name)
        return {'saved': True, 'file': str(self.saved.relative_to(self.root)), 'check': result}
