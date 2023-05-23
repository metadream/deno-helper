/**
 * 生成带省略号的页码数组
 * @example [1, ..., 8, 9, 10, 11, 12, ..., 20]
 * @param around 当前页环绕左右最大页码数（默认值 2）
 * @returns
 */
function calcEllipsisPages(totalPages: number, pageIndex: number, around = 2) {
    const baseCount = around * 2 + 5; // 总元素个数：环绕左右页码*2+当前页+省略号*2+首页+末页
    const surplus = baseCount - 2; // 只出现一个省略号时剩余元素个数
    const startIndex = 1 + 2 + around + 1; // 前面出现省略号的临界点
    const endIndex = totalPages - 2 - around - 1; // 后面出现省略号的临界点

    if (totalPages <= baseCount) { // 全部显示，不出现省略号
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (pageIndex < startIndex) { // 只有后面出现省略号
        return [...Array.from({ length: surplus }, (_, i) => i + 1), "...", totalPages];
    }
    if (pageIndex > endIndex) { // 只有前边出现省略号
        return [1, "...", ...Array.from({ length: surplus }, (_, i) => totalPages - surplus + i + 1)];
    }
    // 两边都有省略号
    return [1, "...", ...Array.from({ length: around * 2 + 1 }, (_, i) => pageIndex - around + i), "...", totalPages];
}

/**
* 分页助手
* @param totalRecords 总记录数
* @param pageSize 每页记录数
* @param pageIndex 当前页码
* @returns
*/
export function paginate(totalRecords: number, pageSize: number, pageIndex: number | string = 1) {
    if (typeof pageIndex === "string") {
        if (!/^[1-9]\d*$/.test(pageIndex)) {
            throw { status: 400, message: "Illegal page number" };
        }
        pageIndex = parseInt(pageIndex);
    }

    const totalPages = Math.ceil(totalRecords / pageSize);
    if (pageIndex > totalPages) {
        throw { status: 400, message: "Page exceeded" };
    }

    const ellipsisPages = calcEllipsisPages(totalPages, pageIndex);
    const startIndex = pageSize * (pageIndex - 1); // 当前页的记录起始位置
    const endIndex = pageSize * pageIndex; // 当前页的记录结束位置
    return { totalRecords, totalPages, pageIndex, ellipsisPages, startIndex, endIndex };
}