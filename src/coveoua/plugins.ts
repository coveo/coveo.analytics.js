import {BasePlugin, PluginOption} from '../plugins/BasePlugin';
import {EC} from '../plugins/ec';
import {SVC} from '../plugins/svc';

export type UAPluginOptions = any[];
export type AvailablePluginsNames = keyof typeof Plugins.pluginMap;
type GenericPlugin = {[fnName: string]: (...any: UAPluginOptions) => any} & BasePlugin;

export class Plugins {
    public static readonly DefaultPlugins: AvailablePluginsNames[] = ['ec', 'svc'];
    public static readonly pluginMap = {
        [EC.Id]: EC,
        [SVC.Id]: SVC,
    };
    private registeredPlugin: Partial<Record<AvailablePluginsNames, BasePlugin>> = {};

    register(name: AvailablePluginsNames, option: PluginOption): void {
        this.registeredPlugin[name] = new Plugins.pluginMap[name](option);
    }

    execute(name: AvailablePluginsNames, fn: string, ...pluginOptions: UAPluginOptions[]) {
        const plugin = this.registeredPlugin[name] as GenericPlugin;
        if (plugin) {
            const actionFunction = plugin[fn];
            return actionFunction.apply(plugin, pluginOptions);
        }
    }
}
