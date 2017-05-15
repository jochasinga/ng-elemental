class StoreSvc {
  constructor () {
    return (mod, msgs) => {
      this.model = mod;
      this.messages = msgs;
      return this;
    }
  }
}

export {StoreSvc};
