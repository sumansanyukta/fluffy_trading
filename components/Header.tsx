import Link from "next/link";
import Image from "next/image";
import UserDropdown from "@/components/ui/UserDropdown";
import NavItems from "@/components/NavItems";

type HeaderProps = {
    user?: { name?: string | null; email?: string | null } | null;
    initialStocks?: StockWithWatchlistStatus[];
};

const Header = ({ user, initialStocks }: HeaderProps) => {
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/">
          <Image src="/assets/icons/logo.svg" alt="Fluffy Trading logo" width={121} height={45} className="h-[45px] w-auto cursor-pointer" />
        </Link>
        <nav className="hidden sm:block">
          <NavItems initialStocks={initialStocks ?? []} />
        </nav>
        <UserDropdown user={user} initialStocks={initialStocks} />
      </div>
    </header>
  )
}

export default Header