import {counter} from "../src/counter.js";

describe("Store service", () => {
  let store;
  let model = 0;
  let messages = {
    Increment : (model => parseInt(model) + 1),
    Decrement : (model => parseInt(model) - 1),
    Reset     : (model => model - model)
  };

  // Before each test load our users module
  beforeEach(angular.mock.module("counter"));
  beforeEach(angular.mock.inject((_storeSvc_) => {
    store = _storeSvc_(model, messages);
  }));

  it("should be defined", () => {
    expect(store).toBeDefined();
  });

  it("should have a model of 0", () => {
    expect(store.model).toBeDefined();
    expect(store.model).toEqual(0);
  });

  it("should have a messages initiated", () => {
    expect(store.messages).toBeDefined();
    expect(store.messages).toEqual(messages);
  });

  it("should have Increment message", () => {
    let value = 0;
    for (let i = 0; i < 10; i++)
      value = store.messages["Increment"](value);

    expect(value).toEqual(10);
  });

  it("should have Decrement message", () => {
    let value = 10;
    for (let i = 0; i < 10; i++)
      value = store.messages["Decrement"](value);

    expect(value).toEqual(0);
  });

  it("should have Reset message", () => {
    let value = 10;
    value = store.messages["Reset"](value);
    expect(value).toEqual(0);
  });
});
