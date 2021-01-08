import {BasePlugin, PluginOptions} from '../plugins/BasePlugin';
import {EC} from '../plugins/ec';
import {SVC} from '../plugins/svc';

export type UAPluginOptions = any[];

export type Plugin = {[fnName: string]: (...any: UAPluginOptions) => any} & BasePlugin & {
        new (options: PluginOptions): Plugin;
    };

export class Plugins {
    public static readonly DefaultPlugins: string[] = [EC.Id, SVC.Id];
    private registeredPluginsMap: Map<string, Plugin> = (() => {
        const map = new Map();
        map.set(EC.Id, EC);
        map.set(SVC.Id, SVC);
        return map;
    })();
    private requiredPlugins: Partial<Record<string, Plugin>> = {};

    require(name: string, option: PluginOptions): void {
        const pluginClass = this.registeredPluginsMap.get(name);
        if (!pluginClass) {
            throw new Error(
                `No plugin named "${name}" is currently registered. If you use a custom plugin, use 'registerPlugin' first.`
            );
        }
        this.requiredPlugins[name] = new pluginClass(option);
    }

    register(name: string, plugin: Plugin) {
        this.registeredPluginsMap.set(name, plugin);
    }

    unrequire(): void {
        this.requiredPlugins = {};
    }

    execute(name: string, fn: string, ...pluginOptions: UAPluginOptions[]) {
        const plugin = this.requiredPlugins[name] as Plugin;
        if (!plugin) {
            throw new Error(`The plugin "${name}" is not required. Check that you required it on initialization.`);
        }
        const actionFunction = plugin[fn];
        if (!actionFunction) {
            throw new Error(`The function "${fn}" does not exists on the plugin "${name}".`);
        }
        return actionFunction.apply(plugin, pluginOptions);
    }
}
