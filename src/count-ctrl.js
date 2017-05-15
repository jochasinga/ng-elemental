import {StoreSvc} from "./store-svc.js";

function CountCtrl ($element, StoreSvc) {
  let initModel = 4;
  let initMessages = {
    Inc   : (model => parseInt(model) + 1),
    Dec   : (model => parseInt(model) - 1),
    Set   : (model, event) => {
      if (/[0-9]/.test(event.key)) {
        return $element.find("input").val();
      }
      if (event.keyCode === 8 || 9 || 13 || 16) {
        return model;
      }
    },
    Attach: (model) => {
      $element.find("input").val(model);
      return model;
    }
  };

  this.store  = StoreSvc(initModel, initMessages);
  this.update = (msg, model, ...args) => {
    if (msg in this.store.messages) {
      this.store.model = this.store.messages[msg](model, ...args);
    }
    return this;
  }
}

export {CountCtrl};
