// biome-ignore lint/suspicious/noShadowRestrictedNames: <toString from mdast-util-to-string>
import { toString } from "mdast-util-to-string";

// /* Use the post's first paragraph as the excerpt */
// export function remarkExcerpt() {
// 	return (tree, { data }) => {
// 		let excerpt = "";
// 		for (const node of tree.children) {
// 			if (node.type !== "paragraph") {
// 				continue;
// 			}
// 			excerpt = toString(node);
// 			break;
// 		}
// 		data.astro.frontmatter.excerpt = excerpt;
// 	};
// }

export function remarkExcerpt() {
	return (tree, { data }) => {
		let excerpt = "";
		// 遍历文章的所有根节点
		for (const node of tree.children) {
			// 1. 跳过不想提取的节点类型
			// heading: 标题 (#, ##)
			// html: HTML 标签
			// code: 代码块 (```) - 通常摘要不放代码，如果需要也可以去掉这个排除
			if (node.type === "heading" || node.type === "html") {
				continue;
			}

			// 2. 使用 toString 获取节点文本
			// mdast-util-to-string 能够递归提取 blockquote (>) 里面的文本
			const text = toString(node).trim();

			// 3. 拼接摘要
			if (text) {
				excerpt += `${text} `;
				// 如果摘要够长了（例如 300 字符），就停止提取
				if (excerpt.length > 300) {
					break;
				}
			}
		}
		data.astro.frontmatter.excerpt = excerpt.trim();
	};
}
