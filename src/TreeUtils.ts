import { Config } from "./Config";
import { TreeItem } from "./Provider/TreeDataProvider";



export class TreeUtils {

    public static getChildById(root: TreeItem, id: string) {

        if (root.id === id) {
            return root;
        }

        for (let i = 0; i < root.children.length; i++) {
            const found = this.getChildById(root.children[i], id)
            if (found) {
                return found
            }
        }
    }

    public static getPathById(tree: TreeItem[], id: string, path: string) {
        const idx = tree.findIndex((node) => {
            return node.id === id
        });
        if (idx < 0) {
            for (const node of tree) {
                if (node.children) {
                    if (node.label) {
                        path += "/" + node.label
                    }

                    return this.getPathById(node.children, id, path);
                }
            }
        } else {
            // if index found this means that the file has been found and full path can be returned
            path += "/" + tree[idx].label;
            return path;
        }
    }

    public static removeAbsoluteSubpath(path: string) {
        // /a/b/c/workingDirectory/d/e/f -> d/e/f
        const workspacePath = Config.getWorkspacePath();
        return path.replace(workspacePath + "/", '');
    }
}