# LetterLock

一个 Wordle 风格的五字母英文猜词小游戏。本版没有每日一题限制，每局最多猜 10 次。

## 运行

直接打开 `index.html`，或在当前目录启动本地服务：

```sh
python3 -m http.server 8765
```

然后访问 `http://localhost:8765`。

## 玩法

每次猜一个五个字母的英文单词。页面下方的键盘会同步显示字母状态：

- 绿色：字母在答案中，且位置正确
- 黄色：字母在答案中，但位置不对
- 灰色：答案里不包含这个字母

可以使用实体键盘，也可以点击页面下方的屏幕键盘。每局最多 10 次，右上角按钮会立即随机换一个新词。

## 统计

右上角的统计按钮会打开本地战绩面板，显示总局数、猜对次数、猜错次数、未完成次数、胜率、猜对时的平均步数，以及 1 到 10 次猜对的分布柱状图。统计保存在浏览器本地。

## 词库

`dictionary.js` 现在拆成三层：

- 可输入猜词：14,953 个有效 Wordle 猜词和补充词
- 补充可猜词：放在 `data/extra-guess-words.txt` 和 `data/extra-proper-guess-words.txt`，只用于输入校验
- 答案候选：2,301 个更常见的五字母答案词
- 答案排除词：放在 `data/excluded-answer-words.txt`，仍可猜，但不会抽成答案

这样不会把 `/usr/share/dict/words` 里那些冷僻旧词，或 `korea` 这类专有名词随机成答案。

来源：

- Guess list: https://github.com/tabatkins/wordle-list
- Answer list: https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b
- Extra guess list: `data/extra-guess-words.txt`
- Extra proper guess list: `data/extra-proper-guess-words.txt`
- Excluded answer list: `data/excluded-answer-words.txt`

重新生成词库：

```sh
node scripts/build-dictionary.js
```

如果想换成自己的词表，可以指定纯文本词表路径：

```sh
WORDLE_GUESS_SOURCE=/path/to/guesses.txt WORDLE_ANSWER_SOURCE=/path/to/answers.txt node scripts/build-dictionary.js
```
