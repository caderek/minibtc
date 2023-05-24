import "./style.css";

import watchMempool from "./watchMempool";
import state from "./state";
import watchPrice from "./watchPrice";
import registerHandlers from "./registerHandlers";

watchMempool(state, 0);
watchPrice(state, 0);

registerHandlers();
