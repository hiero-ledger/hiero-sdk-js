import SubscriptionHandle from "../../../src/topic/SubscriptionHandle.js";

describe("SubscriptionHandle", function () {
    it("unsubscribe calls the stored callback", function () {
        const handle = new SubscriptionHandle();
        let called = false;
        handle._setCall(() => {
            called = true;
        });
        handle.unsubscribe();
        expect(called).to.be.true;
    });

    it("unsubscribe sets _unsubscribed to true", function () {
        const handle = new SubscriptionHandle();
        handle._setCall(() => {});
        handle.unsubscribe();
        expect(handle._unsubscribed).to.be.true;
    });

    it("unsubscribe does nothing when no callback is set", function () {
        const handle = new SubscriptionHandle();
        expect(() => handle.unsubscribe()).to.not.throw();
        expect(handle._unsubscribed).to.be.false;
    });
});
