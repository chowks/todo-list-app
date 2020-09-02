import "./TodoList.css";

import React, { Component } from "react";

import AddIcon from "@material-ui/icons/Add";
import SortByAlphaIcon from "@material-ui/icons/SortByAlpha";
import TodoItems from "./TodoItems";
import { default as localforage } from "localforage";

class TodoList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items: [],
      sorted: false,
      search: [],
    };

    this.addItem = this.addItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.sortItem = this.sortItem.bind(this);

    this.editSearchTerm = this.editSearchTerm.bind(this);

    localforage
      .getItem("updatedTodoList")
      .then((list) => {
        if (list !== null) {
          this.setState({
            items: list,
          });
        } else {
          return "";
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  addItem(e) {
    if (this._inputElement.value !== "") {
      var newItem = {
        text: this._inputElement.value,
        key: Date.now(),
      };

      this.setState((prevState) => {
        return {
          items: prevState.items.concat(newItem),
        };
      });

      this._inputElement.value = "";

      localforage
        .setItem("todolist", this.state.items)
        .then(function (value) {
          // console.log(value);
        })
        .catch(function (err) {
          console.log(err);
        });
    }

    e.preventDefault();
  }

  deleteItem(key) {
    var filteredItems = this.state.items.filter(function (item) {
      return item.key !== key;
    });

    this.setState({
      items: filteredItems,
    });

    localforage
      .setItem("updatedTodoList", filteredItems)
      .then(function (list) {
        // console.log(list);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  sortItem() {
    const { items } = this.state;

    items.sort(function (a, b) {
      if (a.text < b.text) {
        return -1;
      }
      if (a.text > b.text) {
        return 1;
      }
      return 0;
    });

    this.setState({
      items: items,
      sorted: true,
    });

    if (this.state.sorted === true) {
      this.setState({
        items: items.reverse(),
        sorted: false,
      });
    }
  }

  searchFilter(e) {
    this.setState({
      search: e.target.value,
    });
  }

  editSearchTerm = (e) => {
    var currentTodos = [];
    var newList = [];

    if (e.target.value !== "") {
      currentTodos = this.state.items;

      newList = currentTodos.filter((todo) => {
        const lc = todo.text.toLowerCase();

        const filter = e.target.value.toLowerCase();

        return lc.includes(filter);
      });
    } else {
      newList = this.state.prevItem;
    }

    this.setState({
      items: newList,
      // console.log(newList)
    });

    console.log(this.state.items);

    e.preventDefault();
  };

  render() {
    return (
      <div className="todoListMain">
        <div className="header">
          <form onSubmit={this.addItem}>
            <input
              ref={(a) => (this._inputElement = a)}
              placeholder="enter task"
            />
            <button type="submit" className="addBtn">
              <AddIcon style={{ fontSize: "1rem" }} />
            </button>
          </form>
          <button onClick={this.sortItem} className="sortBTN">
            <SortByAlphaIcon style={{ fontSize: "1rem" }} />
          </button>
        </div>

        <TodoItems
          entries={this.state.items}
          delete={this.deleteItem}
          searchEntries={this.state.search}
        />

        <input
          className="searchBar"
          onChange={(e) => this.searchFilter(e)}
          placeholder="search keywords"
        />
      </div>
    );
  }
}

export default TodoList;
