export const debounce = <T extends unknown[]>(func: (...args: T) => void, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: T) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

// 將日期改回time格式
export function parseEventDate(dateString: string): string {
    const [month, day] = dateString.match(/\d+/g) || [];
    if (!month || !day) return dateString;

    const year = new Date().getFullYear();
    const formattedMonth = month.padStart(2, '0');
    const formattedDay = day.padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
}