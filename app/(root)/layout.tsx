import Header from "@/components/Header";
import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {searchStocks} from "@/lib/actions/finnhub.actions";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    const initialStocks = await searchStocks();

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={session?.user ?? null} initialStocks={initialStocks} />
            <div className="container py-10">
                {children}
            </div>
        </main>
    )
}

export default Layout