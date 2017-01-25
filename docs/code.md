系统中权限暂时分成两级，一个是超级管理员，另一个是普通操作员（未完全实现）

操作员的权限相当高，能操作一个项目所有的事情

因此在这个基础上，我对总部对应的项目做特殊处理，总部对应的项目操作员，能够操作所有的来往记录
而其他项目的操作员，只能管理自己项目的内容（未实现）

所有调度、采购、销售都录入同一个表，即库存（未实现）
但是有不同的标记，用来生成报表


## 页面分成两部分
- 管理页面，逐步过渡到从公司全局进行管理，初始的功能为分配操作员和项目元数据
- 项目页面，用来管理项目当前的进度情况，实时监测进度，管理出库入库情况

## 数据
- 常态数据
  常态数据包括基础的建材数据，项目数据等，它不怎么改变，只有改变的时候才重新读取，而且总的量不会很大，这部分数据应该预存到内存中
  常态数据在数据发生改变的时候，重新进行读取
  - 产品数据
  - 项目数据
  - 仓库数据
  - 公司数据

## 注意

访问数据库的时候，应该总是用 _id 来取得 _id，尽管有些情况下 id 也可以获取 id，但是存到session中之后事情就有点不一样了。
！！ 注意存储到 session 这类的存储


## TODO

- [ ] 考虑是使用 react 还是 使用 vue 来改写界面
- [x] 用户登录持久化到 session 中
- [ ] 发归料单显示优化
  - [ ] 折合信息（发归料单位折合）
- [ ] 界面 react 化
  - [ ] 管理界面 react 化
  - [ ] 整体界面 react 化
- [ ] 部分代码使用 vue 替换  
  - [ ] 适合控制增删的代码
  - [ ] 模块化


 ## 初始化数据库

- 刚开始初始化数据库的时候，需要准备一些预先的数据用来处理
 