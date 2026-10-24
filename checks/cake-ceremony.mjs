// The cake ceremony now continues into the original ending.
// Keep this entry point running the full canonical integration check.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
await import(pathToFileURL(resolve('checks/complete-ending.mjs')).href);
