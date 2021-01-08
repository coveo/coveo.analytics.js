import {BasePlugin, PluginOption} from '../plugins/BasePlugin';
import {EC} from '../plugins/ec';
import {SVC} from '../plugins/svc';

export type UAPluginOptions = any[];
export type AvailablePluginsNames = keyof typeof pluginMap;
const pluginMap = {
    [EC.Id]: EC,
    [SVC.Id]: SVC,
};
type GenericPlugin = {[fnName: string]: (...any: UAPluginOptions) => any} & BasePlugin;

export class Plugins {
    public static readonly DefaultPlugins: AvailablePluginsNames[] = [EC.Id, SVC.Id];

    private registeredPlugin: Partial<Record<AvailablePluginsNames, BasePlugin>> = {};

    register(name: AvailablePluginsNames, option: PluginOption): void {
        this.registeredPlugin[name] = new pluginMap[name](option);
    }

    execute(name: AvailablePluginsNames, fn: string, ...pluginOptions: UAPluginOptions[]) {
        const plugin = this.registeredPlugin[name] as GenericPlugin;
        if (!plugin) {
            throw new Error(`The plugin "${name}" is not registered. Check that you passed it on initialization.`);
        }
        const actionFunction = plugin[fn];
        if (!actionFunction) {
            throw new Error(`The function "${fn}" does not exists on the plugin "${name}".`);
        }
        return actionFunction.apply(plugin, pluginOptions);
    }
}
