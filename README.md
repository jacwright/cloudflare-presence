# Cloudflare Presence

This provides presence and cursor support on any website using Workers and Durable Objects. The client portion of the
demo can be abstracted into a separate library to be loaded into any page, but the focus of this project was to get the
server portion working.

[DEMO found here](https://demo.dabblewriter.workers.dev/)

Some interesting things showcased here:
* Uses functional programming with Durable Objects, rather than classes
* Displays everyone in a room by mouse location and name. A room can be any unique name.
* Abstracts the room logic so that it may be multi-tenanted in a Durable Object as makes sense.
* Performance optimizations by sending cursor updates in 50ms batches rather than each one as a separate message. This
  should, in theory, allow more concurrent connections by reducing outgoing traffic. It will also help with browser
  rendering by batching changes.

I have not fully tested load capacity. With 16 browser windows open I had 64 connections at once (4 iframes per window)
and found there was some lag, but looking at a performance trace, the lag was due to GPU with 64 updates happening in
16 windows at the same time. The server and websocket data seemed to do just fine. Though, it was only 1 connection at
a time making updates since I only have one mouse that can only be in one iframe at a time.

I suspect you could improve performance client-side by using a canvas and drawing the cursors to it. This will bypass
the browser's layout phase and eliminate the memory of 64 cursor elements (in this case) from the page.