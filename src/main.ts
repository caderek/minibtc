import "./style.css";

import registerHandlers from "./registerHandlers";
import watchPrice from "./watchPrice";
import watchMempool from "./watchMempool";
import registerDesktopStyles from "./registerDesktopStyles";
// import Chart from "./chart";

// const chart = new Chart(document.querySelector("#chart") as HTMLCanvasElement);

registerDesktopStyles();
registerHandlers();

watchPrice();
watchMempool();
