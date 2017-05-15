import {StoreSvc}   from "./store-svc.js";
import {CountCtrl}  from "./count-ctrl.js";
import {CountCmp} from "./count-cmp.js";

let counter = angular.module("counter", []);
counter
  .service("storeSvc", StoreSvc)
  .controller("countCtrl", CountCtrl)
  .component("countCmp", CountCmp);

export {counter};

/*
document.addEventListener("DOMContentLoaded", () => {
  angular.bootstrap(document, ["CounterApp"]);
});
*/
