import "./style.css";

import registerHandlers from "./registerHandlers";
import watchPrice from "./watchPrice";
import watchMempool from "./watchMempool";

watchPrice();
watchMempool();

registerHandlers();
