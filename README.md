## Hilt
=====

A work-in-progress basis for a style of website framework.

MongoDB
Express

These two libraries are wrapped by apifactory. The routes are inferred from
the nesting of the key-value pairs in the model definition files. The route handlers
are then the end-point of the route, with the necessary middleware added before them.

It also adds the layer of user authentication and permission handling, which can
be configured from the model definition.

AngularJS

The front-end is configured as a single page application, and the models defined
as the api are automatically made available with a promose-based dependency
injection like system, which retrieves the routes available for the models.

For now, the view-controllers still have to be manually added if there are any
views associated with a given model.
