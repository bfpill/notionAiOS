import { getStorage, ref, getDownloadURL } from "firebase/storage";

export async function getIcon(iconName: string): Promise<string | null> {
    const storage = getStorage();
    const iconRef = ref(storage, `icons/${iconName.toLowerCase()}.png`);

    try {
        const url = await getDownloadURL(iconRef);
        return url;
    } catch (error) {
        return await getDownloadURL(ref(storage, 'icons/default-code.png'));
    }
}
