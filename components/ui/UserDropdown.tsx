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

// TODO: auth is not wired up yet. Replace this placeholder with the real
// user data and hook log back into signOut once authentication is implemented.
// import {signOut} from "@/lib/actions/auth.actions";

// TODO: remove these dummy values once real auth + the User type exist
const DUMMY_USER = {
    name: "John Doe",
    email: "john.doe@example.com",
};

const UserDropdown = () => {
    const router = useRouter();

    // TODO: uncomment once signOut exists in "@/lib/actions/auth.actions"
    const handleSignOut = () => {
        // await signOut();
        router.push("/sign-in");
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" className="flex items-center gap-3 text-gray-4 hover:text-yellow-500">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                {DUMMY_USER.name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start">
                            <span className='text-base font-medium text-gray-400'>
                                {DUMMY_USER.name}
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
                                    {DUMMY_USER.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className='text-base font-medium text-gray-400'>
                                    {DUMMY_USER.name}
                                </span>
                                <span className="text-sm text-gray-500">{DUMMY_USER.email}</span>
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
                    <NavItems />
                </nav>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default UserDropdown