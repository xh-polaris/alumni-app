/**
 * @description 把时间戳转化成时间字符串
 * @param {number} timestamp 时间戳
 * @param {string} format 时间格式
 * @return {string} 时间字符串
 */
export function timestampToTime(timestamp: number, format: string = 'yyyy-MM-DD HH:mm'): string {
    const date = new Date(timestamp);

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    const [month, day, year, hour, minute, second] = formattedDate.split(/\/|, |:/);

    return format
        .replace('YYYY', year)
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