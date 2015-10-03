DummyAlexa
====

A Jeopardy playing skill for the [Amazon Echo][echo link]. Powered by [Jservice.io](http://jservice.io). Named after one of Tony Stark's many helper bots.

# Requirements

- One [Amazon Echo][echo link]
- [Amazon Lambda][lambda link], free for the first 1M requests per month.


# Setup

- Clone this repository
- run `make setup`
- run `make build`
- Upload DummyAlexa.zip to [Amazon Lambda][lambda link]. Note the ARN provided from the lambda function.
- Register for an Amazon Skills Kit developer account (free) and create a new skill
- Paste in `speechAssets/IntentSchema.json` and `speechAssets/SampleUtterances.txt` to their respective sections under "Interaction Model"
- Pretend the voice of Alexa is that of Alex Trebek.

# Usage

- Alexa, load Dummy and ask for a random questions
- Alexa, load Dummy and ask for [any number] of random questions


# Contributing

My bitcoin address is [1BXiogdLRwoKsLjTmoaTYZB5Zn8ZoWCwMP](bitcoin:1BXiogdLRwoKsLjTmoaTYZB5Zn8ZoWCwMP) [click for QR](http://f.cl.ly/items/0c2N2F0C3F1X0N2R2K3Z/1BXio.png)

# Questions

[Create an issue!](https://github.com/bxio/dummyAlexa/issues/new)


[echo link]: http://www.amazon.com/dp/B00X4WHP5E/?tag=bxio-20
[lambda link]: http://aws.amazon.com/lambda
