// The most basic primitive in MDT is just a function
Handler = function Handler(handler) {
  if (handler instanceof Handler) {
    return handler
  }
  else if (typeof handler == 'function') {
    this.handler = handler
  }
  else {
    throw new Error('Handler must have a function.')
  }
}

// Didn't get very far with this...
/*

So, the goal is to have writing handlers as easy as possible, just a function should be enough.
The prototype will fill in the missing pieces.

What are the pieces we need to have a reactive, cached API

Thinking all this should be in the router now... handlers are routers...

Fuck no, we want to avoid doing url parsing to look for routes if we don't need that.
For all endpoints, that's a waste.

But we want to reuse some functionality? no... not really

Where should the cache live..., at the root or the endpoints???? Or everywhere in the middle too...?

Let's say A depends on B
A registers dependency on "B" centrally...? But changes are broadcast endpoint down...?
So when A reads B, it registers dependency on B.
B changes, calls all dependents. Should dependants recalculate before broadcasting their own change?
It should be up to the parent to decide if change should be sent down tree... or should it?

No, change should only be triggered if there is a change in the data returned. End of story.

A recalculates and compares hashes of new result to old. Emits change if necessary.

So each handler needs:
handle - a function to return data
hash - a function to return a hash of its own data, default to JSON.stringify
And it needs to be able to emit change events for urls it manages... meaning it needs to manage listeners
It should also know that it is being watched, meaning it needs to handle unregistering... handled at handler or router...?
We can handle all registering... what's important for handler to know is what urls are being watched. Doesn't give a shit about who is listening
Is is helpful to know when watched urls change or just call watch(listOfUrls)? Convenience i guess
Whole app sits inside reactive call.
Inside a reactive call, how do we know what sources are no longer needed?
We only listen to changes on sources that are called directly, not children.
So we keep track of the current call using a stack.
Keep record of all calls from this one and register callbacks with each.
A.dependencies = [B]
If dependencies change the next time it is run, deregister missing callbacks. Easy
Handler should decide what urls to fire change events for, all, one, some.
So from the handler, there will be an API like emitChange() or emitChange('/1') or emitChange((url) -> startsWith...)
And from owners of the handler, onChange() or onChange('/1', function)
Pass it all down through the handler chain?
As well as doing a 'get' you could pass down that it is reactive, adding url to list of urls that the handler can access
Deregistering could be done through the same chain, send a 'dereference' action that A is no longer interested.
So... a handler needs to know what it is referencing AND what it is being referenced by.
And independent of caching.
Handler psuedocode:
collectcalls
handle
calls = finishcollecting
each(callsmissingfromlasttime)
  dereference missingcall, thisurl


*/