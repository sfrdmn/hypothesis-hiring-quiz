# Technical exercise

Since you've applied to work with us in a role that has technical components, we
ask you to complete a short exercise that is intended to explore some of the
skills we're looking for.

Please do this in your own time, and don't spend more than a few hours on it: we
know your time is valuable and don't want to use any more of it than we need to
make a fair assessment.

## Specification

In our software, users can write comments. When writing a comment, a user might
want to reference another user by name or username. Please create an input field
for a comment which can assist the user in correctly completing user's names or
usernames.

One approach might be as follows (although feel free to ignore this approach if
you have a better solution to the problem):

- A widget should appear when the user starts typing a person's name or
  username.
- The widget should present a list of matching people.
- When a person is selected, their name (or username) should be inserted into
  the comment area.

The user data is provided as JSON (data.json) which can be loaded into the demo
page by an Ajax call or any other method you deem appropriate (including
inlining). Feel free to modify the data structure.

(Don't worry if some avatar images don't appear to match the user's names: we
have matched avatars with randomly generated names.)

Your solution should be provided as a git repository with instructions on how to
run the demo locally.

## Evaluation

We will be looking for:

- An implementation that is helpful to the user and doesn't get in the way of
  their primary task (writing a comment).
- An implementation that solves the problem identified by the specification.
- Clear, readable code and markup that is easy to understand and modify.
- Suitable handling of errors and unexpected user input.
- An appropriate level of testing and documentation.

## Additional information

The browser statistics for the target site:

```
Chrome (latest)             |  70%
Firefox (latest)            |  15%
Chrome on Android (latest)  |   5%
Safari 9                    |   2%
iOS Safari 9.x              |   1.4%
Edge 12                     |   1%
Internet Explorer 11        |   1%
```

## In conclusion

We want you to use this as an opportunity to show us the kind of work you'd do
for us if hired. Please do this work as you would if you were intending on
putting it into production.

Our "specification" doesn't pin down every detail of what we expect. Please make
the best decisions you can given the information provided. That said, if you
think something is really badly specified or confusing, please do get in touch
for clarification: nickstenning@hypothes.is.
