import { ExtensionContext } from '../../extension-host/api.types';

export function activate(context: ExtensionContext) {
  console.log('Varta Default Theme extension activated');
}

export function deactivate() {
  console.log('Varta Default Theme extension deactivated');
}
