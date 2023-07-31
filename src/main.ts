import "./style.css";

import registerHandlers from "./registerHandlers";
import watchPrice from "./watchPrice";
import watchMempool from "./watchMempool";
import registerDesktopStyles from "./registerDesktopStyles";

registerDesktopStyles();
registerHandlers();

watchPrice();
watchMempool();
