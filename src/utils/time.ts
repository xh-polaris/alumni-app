/**
 * @description 把时间戳转化成时间字符串
 * @param {number} timestamp 时间戳
 * @param {string} format 时间格式
 * @return {string} 时间字符串
 */
export function timestampToTime(timestamp: number, format: string = 'yyyy-MM-DD HH:mm'): string {
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return format
        .replace('yyyy', year.toString())
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hour)
        .replace('mm', minute)
        .replace('ss', second);
}

/**
 * @description 将日期时间字符串转换为时间戳
 * @param {string} dateString 日期时间字符串，格式应与 timestampToDate 中的 format 参数一致
 * @returns {number} 时间戳（毫秒）
 */
export function dateToTimestamp(dateString: string): number {
    const [year, month, day, hour, minute, second] = dateString.split(/[- :]/);

    const date = new Date(+year, +month - 1, +day, +hour, +minute, +second);
    return date.getTime();
}