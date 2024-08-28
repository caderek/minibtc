import "./style.css"

import registerHandlers from "./registerHandlers"
import watchPriceAlt from "./watchPriceAlt"
import watchMempool from "./watchMempool"
import registerDesktopStyles from "./registerDesktopStyles"
// import Chart from "./chart";

// const chart = new Chart(document.querySelector("#chart") as HTMLCanvasElement);

registerDesktopStyles()
registerHandlers()

watchPriceAlt()
watchMempool()
