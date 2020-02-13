# How to update the gitHub page

ATM there is no automated way to update them. The only way is to pull from master
or recreate the page on master.

The page should show a demo of the soundboard. The page can be found in the branch `gh-pages`.

## Whats the difference to master?

`customizations.json` is not ignored and there exists one as there exists an `example_sounds.json` to be able to load all sounds in `example_sounds`. Also the `node_module` bindings in `ìndex.html` are replaced with the corresponding files under an extra `essential` called folder.

### Why don't put the essential folder in master?

We don't want to mess with the modules were are using, that's why we don't want to maintain them near development. I've seen that in other projects and if a problem occurred those files were touched, if such files get touched, it's hard to update them.