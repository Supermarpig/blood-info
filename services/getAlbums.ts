// /services/getAlbums.ts
export async function fetchAlbums(username: string, accessToken: string) {
    const response = await fetch(`https://api.imgur.com/3/account/${username}/albums`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const data = await response.json();

    if (data.success) {
        console.log('Albums:', data.data); // 打印所有相簿信息
        return data.data; // 返回相簿信息的數組
    } else {
        console.error('Failed to fetch albums:', data);
        throw new Error(data.data.error || 'Unknown error fetching albums');
    }
}
