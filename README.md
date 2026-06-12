# LetterLock

这个目录里当前上线的是 LetterLock：

- `index.html`：LetterLock，一个 Wordle 风格的五字母英文猜词小游戏。

## 运行

直接打开 `index.html`，或在当前目录启动本地服务：

```sh
python3 -m http.server 8765
```

然后访问：

- `http://localhost:8765/` 玩 LetterLock

## LetterLock 玩法

每次猜一个五个字母的英文单词。页面下方的键盘会同步显示字母状态：

- 绿色：字母在答案中，且位置正确
- 黄色：字母在答案中，但位置不对
- 灰色：答案里不包含这个字母

可以使用实体键盘，也可以点击页面下方的屏幕键盘。每日挑战最多 6 次，练习模式最多 10 次；练习模式未结束时，右上角按钮会重开本局并换一个词，结束后才会进入下一局。

## 统计

右上角的统计按钮会打开本地战绩面板，按每日挑战和练习模式分别记录。统计保存在浏览器本地。

## 词义

结束后会展示答案、英文释义、中文含义和常见程度标签。词义数据来自 ECDICT，并生成为轻量的 `word-info.js`。

## 分享

结束后可以打开分享结果弹窗，生成不包含答案的分享卡和分享文案。

## 词库

`dictionary.js` 现在拆成三层：

- 可输入猜词：14,953 个有效 Wordle 猜词和补充词
- 补充可猜词：放在 `data/extra-guess-words.txt` 和 `data/extra-proper-guess-words.txt`，只用于输入校验
- 答案候选：1,500 个更常见、更适合非 native 玩家猜的五字母答案词
- 答案排除词：放在 `data/excluded-answer-words.txt`，仍可猜，但不会抽成答案

这样不会把 `/usr/share/dict/words` 里那些冷僻旧词，或 `korea` 这类专有名词随机成答案。

来源：

- Guess list: https://github.com/tabatkins/wordle-list
- Answer list: https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b
- Extra guess list: `data/extra-guess-words.txt`
- Extra proper guess list: `data/extra-proper-guess-words.txt`
- Excluded answer list: `data/excluded-answer-words.txt`
- Word info: https://github.com/skywind3000/ECDICT

重新生成词库：

```sh
node scripts/build-dictionary.js
```

重新生成词义：

```sh
ECDICT_SOURCE=/path/to/ecdict.csv FREQUENCY_SOURCE=/path/to/en_50k.txt node scripts/build-word-info.js
```

如果想换成自己的词表，可以指定纯文本词表路径：

```sh
WORDLE_GUESS_SOURCE=/path/to/guesses.txt WORDLE_ANSWER_SOURCE=/path/to/answers.txt node scripts/build-dictionary.js
```
