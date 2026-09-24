'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {LogOut} from "lucide-react";
import NavItems from "@/components/NavItems";
import {signOut} from "@/lib/actions/auth.actions";
import Link from "next/link";

type UserDropdownProps = {
    user?: { name?: string | null; email?: string | null } | null;
    initialStocks?: StockWithWatchlistStatus[];
};

const UserDropdown = ({ user, initialStocks }: UserDropdownProps) => {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push("/sign-in");
            router.refresh();
        } catch (e) {
            console.error(e);
        }
    }

    if (!user) {
        return (
            <Button
                render={<Link href="/sign-in" />}
                variant="ghost"
                className="group/button inline-flex items-center text-gray-400 hover:text-yellow-500"
            >
                Sign in
            </Button>
        )
    }

    const displayName = user.name || user.email || 'User';
    const initials = displayName[0].toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" className="flex items-center gap-3 text-gray-4 hover:text-yellow-500">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start">
                            <span className='text-base font-medium text-gray-400'>
                                {displayName}
                            </span>
                        </div>
                    </Button>
                }
            />
            <DropdownMenuContent className="text-gray-400">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>
                        <div className="flex relative items-center gap-3 py-2">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className='text-base font-medium text-gray-400'>
                                    {displayName}
                                </span>
                                {user.email && (
                                    <span className="text-sm text-gray-500">{user.email}</span>
                                )}
                            </div>
                        </div>
                    </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-gray-600"/>
                <DropdownMenuItem onClick={handleSignOut} className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
                    Logout
                </DropdownMenuItem>
                <DropdownMenuSeparator className="hidden sm:block bg-gray-600"/>
                <nav className="sm:hidden">
                    <NavItems initialStocks={initialStocks ?? []} />
                </nav>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default UserDropdown