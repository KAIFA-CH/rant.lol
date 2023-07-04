import { MinimalFooter } from "./modifiedMinimalFooter";
import Kaifalogo from "../../../../public/kaifalogo.svg";

export function Foot() {
    return (
        <MinimalFooter socialLinks={["github"]} copyrightStatement="&copy; 2023 KAIFA. All rights reserved." logoHref="https://rant.lol" logoSVG={Kaifalogo} />
    )
}