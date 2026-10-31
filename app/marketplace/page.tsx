import { cookies } from "next/headers";

import MarketplaceContent from "@/components/marketplace/MarketplaceContent";



export default async function MarketplacePage(){


const cookieStore = await cookies();


const session =
cookieStore.get("skillchain_session");



return (

<MarketplaceContent

isLoggedIn={!!session}

/>

);


}