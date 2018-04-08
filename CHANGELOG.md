## 1.3.0
- Added convenience toggle command to toggle between `indentation` and `language` folding strategies
  - VSCode 1.22+ new language folding does not have the API's available to allow Fold Plus to work correctly in `language` folding mode.  This command is provided to make it easier to toggle between the modes when using Fold Plus. [Issue for reference 47404](https://github.com/Microsoft/vscode/issues/47404)
  - There is now a warning when issuing a `Fold Plus` command and the current folding strategy is not set to `indentation`
- Added all commands to `Fold Plus` command category

## 1.2.2
- Fix bug when cursor next to non word character when executing some fold commands

## 1.2.1
- Fix 'Fold Children' folding parent when there are non foldable children

## 1.2.0
- New command 'Fold All Same Level As Parent'
- New command 'Fold Parent'
- New command 'Fold Children'

## 1.1.0
- New command 'Fold All keep Cursor Line'
- Word highlighting now restored after fold
- Fixed issues with tabs

## 1.0.2
- Word under cursor matches only exact word now.  Selections match any line containing.
- Fixed issues with emply lines and spaces
- Fixed issues handling mixed tabs and spaces

## 1.0.1
- Icon update

## 1.0.0
- Initial release