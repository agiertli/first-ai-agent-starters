"""The same narrow quotation tools, exposed locally over MCP stdio."""
from pathlib import Path
from mcp.server.mcpserver import MCPServer
from mcp.types import ToolAnnotations
from quote_tools import QuoteTools

toolkit = QuoteTools(Path(__file__).resolve().parent)
server = MCPServer("workshop-quotes")


@server.tool(annotations=ToolAnnotations(readOnlyHint=True, openWorldHint=False))
def read_materials() -> dict:
    """Read the fictional customer request and supplier offers."""
    return toolkit.execute("read_materials", {})


@server.tool(annotations=ToolAnnotations(readOnlyHint=True, openWorldHint=False))
def check_quote(supplier_id: str) -> dict:
    """Check quantity, budget and delivery for one supplier. At most three checks."""
    return toolkit.execute("check_quote", {"supplier_id": supplier_id})


@server.tool(annotations=ToolAnnotations(readOnlyHint=False, destructiveHint=False, openWorldHint=False))
def save_quote(supplier_id: str) -> dict:
    """Save one checked, feasible draft in output. Rechecks current data. Never sends or orders."""
    return toolkit.execute("save_quote", {"supplier_id": supplier_id})


if __name__ == "__main__":
    server.run()
