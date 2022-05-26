# Cloudflare Presence

This provides presence and cursor support on any website using Workers and Durable Objects. The client portion of the
demo can be abstracted into a separate library to be loaded into any page, but the focus of this project was to get the
server portion working.

[DEMO found here](https://demo.dabblewriter.workers.dev/)

Some interesting things showcased here:
* Uses functional programming with Durable Objects, rather than classes
* Displays everyone in a room by mouse location and name. A room can be any unique name.
* Abstracts the room logic so that it may be multi-tenanted in a Durable Object as makes sense

I have not tested load capacity.