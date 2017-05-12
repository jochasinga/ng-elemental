<img src="images/diagram.png" width=650></img>

# ng-elemental
AngularJS application pattern for unidirectional flow, inspired by [Elm](https://www.gitbook.com/book/evancz/an-introduction-to-elm/details) and [Flux](https://facebook.github.io/flux/).

Read about [why I created this pattern](https://medium.com/@jochasinga/writing-angular-app-the-elms-way-6e98ad305570).

## Complexity
To a naive developer, AngularJS can feel like a yarn ball glued to the digest cycle. What makes AngularJS "multi-angle" are:
+ unrestricted immutability surface
+ bidirectional data flow
+ lack of clear lines between controllers and services 
+ ubiquitous mutation of state within injected services from any controller

Below are examples of entangled messes.

#### Example 1
AngularJS service class which have wide immutability surface and also provide too many methods to mutate the state when it should have delegated to a controller.

```javascript

class FooService {
  constructor() {
    this.state = "foo";
  }
  addBaz() {
    this.state = this.state + " baz";
  }
  addBar() {
    this.state = this.state + " bar";
  }
  _addBaz() {
    this.addBaz();
  }
  
  // this goes on ...
}

angular.module("Foo").service("FooService", FooService);

```

#### Example 2
An AngularJS controller using both the service instance and the one attached to its scope to mutate the model state.

```javascript

function FooController ($scope, FooService) {
  $scope.FooService = FooService;
  $scope.addBaz = () => {
    FooService.addBaz();
	
    // or you can do this
	// $scope.FooService.addBaz();
  }
}

angular.module("Foo").controller("FooController", FooController);


```

#### Example 3
The DOM can access local `FooService` to call its `addBaz` or it can call the controller's `addBaz` to mutate the model state.

```html

<div ng-controller="FooController">
  <!-- Using controller's service instance as API to state -->
  <button ng-click="FooService.addBaz()">Add Baz from Svc</button>

  <!-- Using controller's method as API to state -->
  <button ng-click="addBaz()">Add Baz from Ctrl</button>
</div>

```

## The Elm's Way
Read about [Elm's architecture](https://guide.elm-lang.org/architecture/).)


## Model-Update-View
This is an opinionated pattern and not a framework, module, or even a rule. This can appear as an anti-pattern to Javascript and Angular programmers. This is a fresh bias from someone who wants to improve his Angular pattern.

With that in mind, here is a few things I would do going forward with AngularJS. This pattern is heavily influenced by the Elm architecture (which had also inspired Redux). 

### Model 
+ A service should act as a store or a state container, and should always coupled by a controller instead of trying to provide its owner API.
+ A service’s constructor must return a closure instead of setting its internal state in a constructor so it can be injected with starting model state and messages option.
+ A service’s state should only be updated via an `update` function.

```javascript

// ES6 class

class MyStoreService {
  constructor () {
    return (initState, messageOpts) => {
      this.model = initState;
      this.messages = MessageOpts;
      return this;
    }
  }
}

// or

function MyStoreService () {
  return (initState, messageOpts) => {
    return {
      model: initState,
      messages: messageOpts
    }
  }
}

app.module("services", []).service("myStoreService", MyStoreServce);

```

Returning a closure instead of having a service being initiated implicitly is easier to test as well as encourages delegating the task of initiating the state to some other entity. This is an example of a controller initiating a store locally, but it could have fetched a starting state from another service:

```javascript

function MyStoreController (myStoreService) {

  let model = { 
    name: "", 
    age: 0 
  };
  let messages = {};
  
  // Initiating a myStore service
  this.store = myStoreService(model, messages);
}

```

### Update
+ The controller initiates the starting model state and messages mapping (or use another service to fetch the data, possibly via `$http`) by injecting them into its service’s constructor. 
+ The controller contains only one function, namely `update` (it can be any name), which sends an appropriate message string to call an associated pure function in the `messageOpts` (as seen in the above code), an object mapping messages to functions. 

Here is what an update function may look like:

```javascript

function MyStoreController (myStoreService) {

  let model = { 
    name: "", 
    age: 0 
  };
  let messages = {
    SetName: (model, newName) => {
      return Object.assign(model, {name: newName});
    },
    SetAge: (model, newAge) => {
      return Object.assign(model, {age: newAge});
    }
  };
  
  // model
  this.store = myStoreService(model, messages);
  
  // update
  this.update = (message, ...args) => {
  if (message in this.store.messages) {
    this.store.model = this.store.messages[message](...args);
  }
}

```
As you can see, the `myStoreService` instance only holds the model state and messages, and does not responsible for anything else. It is okay to maybe wrap the implementation of the controller's `update` function inside the service as a private method i.e. `_update` as long as it won't be used outside of the controller's `update`.

The `messageOpts` object ideally store pure functions which accept a `model` (not its property value) as one of the arguments, and use the rest of the arguments in an expression that merges and/or clones and return a modified `model`. The `update` function is the only place that gets to mutate the model state.

### View
+ Components is preferred over directives.
+ In a component, a UI-driven action should always call the update function with the right message and arguments.
+ A component can interpolate the data in the model from the controller’s instance of service.
+ Only use one-directional bindings (i.e. “<” for inputs)
+ Bidirectional bindings should be avoided; i.e. `ngModel` should be used with `ng-model-options="{gettingSetter: true}"` to call `update` as a setter function.

Here is how a component might look like:

```javascript

let storeDashboard = {
  controller: myStoreController,
  bindings: {
    title: "<"
  },
  template: `
    <h4>{{$ctrl.title}}</h4>
    <ul>
      <li>
        {{$ctrl.store.model.name}}
        <input ng-model="$ctrl.update('SetName', $ctrl.store.model)"
               ng-model-options="{ getterSetter: true }">
      </li>
      <li>
        {{$ctrl.store.model.age}}
        <button ng-click="$ctrl.update(0)('SetAge', $ctrl.store.model)">Reset</button>
      </li>
    </ul>
  `
}

```

Note that the `update` function looks a bit off. This is because it has become a curried function in order to play nice with `ngModel`, which call a setter with `input.val()` as the first argument implicitly. Thus, the `update` function now looks like this:

```javascript

function MyStoreController (myStoreService) {

  // ...
  
  this.update = (...args) => {
    return (message, model) => {
      if (angular.isDefined(...args)) 
        this.store.model = this.store.messages[message](model, ...args);
      else
        this.store.model = this.store.messages[message](model);
    }
  }
}

```

It makes a lot of sense, since in a functional ML-like language like Elm all functions are basically curried. This gives great flexibility and also quite interesting literal:

```javascript

// Update by sending value 16 with 'SetAge' message on the model
ctrl.update(16)('SetAge', ctrl.store.model)

```

With this change, we have just tweaked `ngModel` to update the model via `update`.

## Predictability
With this pattern, it is much easier to trace how the model gets mutated as a packaged state. The controller becomes very lean, since all the local functions are refactored and grouped into the messages object as pure functions and let `update` act as a single immutability surface. To recap, here is a simple counter app portraying the three parts, `Model-View-Update`.

```javascript

function counterSvc () {
  return (model, messages) => {
    return {
      model: model,
      messages: messages
    }
  }
}

function counterCtrl (counterSvc) {
  let model = 0;
  let counterMsg = {
    Inc   : (model) => { return model + 1; },
    Dec   : (model) => { return model - 1; },
    Reset : (model) => { return model - model; },
    Set   : (model, val) => { return val; }
  }
  this.store = counterSvc(model, counterMsg);
  this.update = (...args) => {
    return (msg, model) => {
      if (msg in this.store.messages) {
        if (angular.isDefined(...args))
          this.store.model = this.store.messages[msg](model, ...args);
        else
          this.store.model = this.store.messages[msg](model);
      }
    }
  }
}

let counterComponent = {
  controller: counterCtrl,
  template: `
    <p>{{$ctrl.store.model}}</p>
    <label for="number-setter">Set a number</label>    
    <input id="number-setter"
           ng-model-options="{ setterGetter: true }"
           ng-model="$ctrl.update('Set', $ctrl.store.model)">
    <button ng-click="$ctrl.update()('Inc', $ctrl.store.model)">
      &#45;
    </button>
    <button ng-click="$ctrl.update()('Dec', $ctrl.store.model)">
      &#43;
    </button>
    <button ng-click="$ctrl.update()('Reset', $ctrl.store.model)">
      &times;
    </button>
  `
}

angular.module("counterApp", [])
  .service("counterSvc", counterSvc)
  .controller("counterCtrl", counterCtrl)
  .component("counterView", counterComponent);

```
