import "./style.css";

import watchMempool from "./watchMempool";
import state from "./state";
import watchPrice from "./watchPrice";
import registerHandlers from "./registerHandlers";

watchMempool(state);
watchPrice(state);

registerHandlers();
