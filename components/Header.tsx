import Link from "next/link";
import Image from "next/image";
import UserDropdown from "@/components/ui/UserDropdown";
import NavItems from "@/components/NavItems";

const Header = () => {
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/">
          <Image src="/assets/icons/logo.svg" alt="Fluffy Trading logo" width={121} height={45} className="h-[45px] w-auto cursor-pointer" />
        </Link>
        <nav className="hidden sm:block">
          <NavItems />
        </nav>
        <UserDropdown />
      </div>
    </header>
  )
}

export default Header