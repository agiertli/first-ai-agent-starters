/** Static builds never contact the lecture backend or read its configuration. */
export const browserRuntime = import.meta.env.MODE === 'static';
export const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
