import { urlStorage } from "@/lib/url-storage";
import { redirect } from "next/navigation";

interface Props {
    params: {
        shortCode: string;
    };
}

export default async function RedirectPage({ params }: Props) {
    const { shortCode } = params;

    const originalUrl = urlStorage.get(shortCode);

    if (originalUrl) {
        redirect(originalUrl);
    }

    // If URL not found, redirect to home with error
    redirect('/?error=url-not-found');
}