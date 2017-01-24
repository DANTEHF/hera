/**
 * Created by seal on 13/01/2017.
 */

import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Link } from 'react-router'

class Project extends Component {
  handleDelete = (e, project) => {
    e.preventDefault()
    if (confirm(`确认要删除 ${project.company} ${project.name} `)) {
      alert('暂时不支持删除项目！')
    }
  }
  render() {
    return (
      <div>
        <table className="table table-bordered">
          <thead>
          <tr>
            <th rowSpan="2">公司名称</th>
            <th rowSpan="2">公司电话</th>
            <th rowSpan="2">项目部名称</th>
            <th rowSpan="2">项目部电话</th>
            <th rowSpan="2">项目部地址</th>
            <th colSpan="2">联系人</th>
            <th rowSpan="2">仓库类型</th>
            <th rowSpan="2">备注</th>
            <th rowSpan="2">操作</th>
          </tr>
          <tr>
            <th>姓名</th>
            <th>电话</th>
          </tr>
          </thead>
          <tbody>
          {this.props.projects.map(project => (
            project.contacts.map((contact, index) => {
              if (index == 0) {
                const rowSpan = project.contacts.length
                return (
                  <tr key={project._id}>
                  <td rowSpan={rowSpan}>{project.company}</td>
                  <td rowSpan={rowSpan}>{project.companyTel}</td>
                  <td rowSpan={rowSpan}>{project.name}</td>
                  <td rowSpan={rowSpan}>{project.tel}</td>
                  <td rowSpan={rowSpan}>{project.address}</td>
                  <td>{contact.name}</td>
                  <td>{contact.phone}</td>
                  <td rowSpan={rowSpan}>{project.type}</td>
                  <td rowSpan={rowSpan}>{project.comments}</td>
                  <td rowSpan={rowSpan}>
                    <Link to={`/project/${project._id}/edit`} >编辑</Link>
                    <a href="#" onClick={e => this.handleDelete(e, project)}>删除</a>
                  </td>
                </tr>
                )
              } else {
                return (
                  <tr key={project._id + index}>
                    <td>{contact.name}</td>
                    <td>{contact.phone}</td>
                  </tr>
                )
              }
            })
          ))}
          </tbody>
        </table>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    projects: state.projects
  }
}

export default connect(mapStateToProps)(Project);