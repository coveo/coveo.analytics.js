# Contributing

## Guidelines

-   Make sure your changes are fully tested (when applicable).
-   We tend to avoid comments in our code base, we strongly prefer good naming and code structure.
-   Avoid pushing similar changes in different commits if it's within the same feature, because we want the changelogs to be clear and simple. To avoid that, there are at least 2 options:
    1. Squash the commits into one when merging (you need to edit the final commit message though)
    1. amend the previous commit when making related changes (`git commit --amend --no-edit`)

## Commit messages

**Every commit message must comply with the [Coventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. We use the commit messages to automatically bump the package version according to the semantic versionning notation. Moreover, we generate changlogs for each version using those commit messages.**

-   You can either manually write a commit message that follows the convention using your favorite method.
-   Or you can run `npm run commit-cli`. It will prompt you some questions about the nature of your changes, then it will commit your staged changes along with a generated message that follows our convention.