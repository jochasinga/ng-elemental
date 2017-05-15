import {CountCtrl} from "./count-ctrl.js";


let CountCmp = {
  controller: CountCtrl,
  template:`
    <div class="todo">
      <p>{{$ctrl.store.model || 0}}</p>
      <input type="text"
             value="{{$ctrl.store.model}}"
             ng-keyup="$ctrl.update('Set', $ctrl.store.model, $event)">
      <button type="button"
              ng-click="$ctrl
                        .update('Dec', $ctrl.store.model)
                        .update('Attach', $ctrl.store.model)">
        -
      </button>
      <button type="button"
              ng-click="$ctrl
                        .update('Inc', $ctrl.store.model)
                        .update('Attach', $ctrl.store.model)">
        +
      </button>
    </div>
  `
};

export {CountCmp};
