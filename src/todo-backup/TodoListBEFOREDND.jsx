import "./TodoList.css";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  SortByAlpha as SortByAlphaIcon,
} from "@material-ui/icons";
import {
  Box,
  Checkbox,
  Container,
  CssBaseline,
  Grid,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core";
import React, { Component } from "react";

import { DragDropContext } from "react-beautiful-dnd";
import FlipMove from "react-flip-move";
import localforage from "localforage";

const LOCAL_STORAGE_KEY = "TODO_LIST";

class TodoList extends Component {
  state = {
    items: [],
    keyword: "",
    isSorted: undefined,
    taskValue: "",
    isEditing: {},
    editedValue: "",
    isChecked: undefined,
  };

  componentDidMount() {
    localforage
      .getItem(LOCAL_STORAGE_KEY)
      .then((list = []) => this.setState({ items: list || [] }))
      // .then((list=[]) => this.state = list \\)
      .catch(console.error);
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
    e.stopPropagation();
  };

  handleUpdateIndexDB = () => {
    const { items } = this.state;
    localforage.setItem(LOCAL_STORAGE_KEY, items).catch(console.error);
  };

  handleAddItem = (e) => {
    e.preventDefault();

    const { taskValue } = this.state;

    if (taskValue !== "") {
      const newItem = {
        text: taskValue,
        key: Date.now(),
      };

      this.setState(
        (prevState) => ({
          items: [...prevState.items, newItem],
          taskValue: "",
        }),
        this.handleUpdateIndexDB
      );
    }
  };

  handleDeleteItem = ({ key }) => {
    this.setState((prevState) => {
      const newItems = [...prevState.items];
      const index = newItems.findIndex((item) => item.key === key);
      if (index > -1) {
        newItems.splice(index, 1);
      }
      return { items: newItems };
    }, this.handleUpdateIndexDB);
  };

  handleToggleSort = () => {
    this.setState(
      (prevState) => ({
        isSorted: !prevState.isSorted,
      }),
      this.handleUpdateIndexDB
    );
  };

  handleEditTodo = ({ key }) => {
    this.setState((prevState) => ({
      isEditing: !prevState.isEditing,
    }));

    this.setState((prevState) => {
      const newItems = [...prevState.items];
      const index = newItems.findIndex((item) => item.key === key);
      if (index > -1) {
        newItems[index].text = this.state.editedValue;
      }
      return newItems;
    }, this.handleUpdateIndexDB);
  };

  handleEditStateChange = (e, { key }) => {
    this.setState({ isEditing: { [key]: true } });
  };

  condRender = (item) => {
    const { isEditing } = this.state;
    if (isEditing[item.key]) {
      return (
        <>
          <TextField
            autoFocus
            label="Edit Task"
            onChange={(e) => this.editTodoValue(e)}
            onBlur={() => this.handleEditTodo(item)}
            variant="outlined"
            size="small"
          />
        </>
      );
    }
    return (
      <ListItemText
        primary={item.text}
        primaryTypographyProps={{
          className: this.state.isChecked ? "lineThrough" : "",
        }}
        secondary={this.state.isChecked ? "Completed !" : null}
      />
    );
  };

  editTodoValue = (e) => {
    this.setState({
      editedValue: e.target.value,
    });
  };

  onCheckBox = (e) => {
    const { checked } = e.target;
    if (checked === true) {
      this.setState(
        {
          isChecked: true,
        },
        this.handleUpdateIndexDB
      );
    } else if (checked === false) {
      this.setState(
        {
          isChecked: false,
        },
        this.handleUpdateIndexDB
      );
    }
  };

  renderItems = () => {
    let { items } = this.state;
    const { keyword, isSorted, isChecked } = this.state;
    if (keyword) {
      items = items.filter((item) => item.text.includes(keyword));
    }
    if (isSorted !== undefined) {
      items = items.sort((a, b) => {
        if (a.text < b.text) {
          return isSorted ? -1 : 1;
        }
        if (a.text > b.text) {
          return isSorted ? 1 : -1;
        }
        return 0;
      });
    }

    return items.map((item) => (
      <ListItem disableGutters key={item.key}>
        <ListItemIcon>
          <Checkbox
            checked={isChecked}
            onChange={(e) => this.onCheckBox(e, item)}
            color="primary"
          />
        </ListItemIcon>
        {this.condRender(item)}
        <ListItemSecondaryAction>
          <IconButton
            onClick={(e) => this.handleEditStateChange(e, item)}
            className={!this.state.isEditing ? "hideBtn" : null}
          >
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => this.handleDeleteItem(item)}>
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    ));
  };

  render() {
    const { taskValue } = this.state;
    return (
      <Paper className="paper">
        <div className="todoListMain">
          <Typography variant="body2" className="title">
            To Do List App
          </Typography>
          <div className="header">
            <form onSubmit={(e) => this.handleAddItem(e)}>
              {/* <input
                name="taskValue"
                onChange={this.handleInputChange}
                placeholder="Enter Task"
                value={taskValue}
              /> */}
              <TextField
                label="Enter Task"
                margin="dense"
                name="taskValue"
                onChange={this.handleInputChange}
                value={taskValue}
                variant="outlined"
              />
              <IconButton type="submit" color="primary" className="squareBtn">
                <AddIcon style={{ fontSize: "1rem" }} />
              </IconButton>
            </form>
            <IconButton
              onClick={this.handleToggleSort}
              type="submit"
              color="primary"
              className="squareBtn"
            >
              <SortByAlphaIcon style={{ fontSize: "1rem" }} />
            </IconButton>
          </div>
          <ul className="theList">
            <FlipMove duration={250} easing="ease-out">
              {this.renderItems()}
            </FlipMove>
          </ul>
          {/* <input
            className="searchBar"
            name="keyword"
            onChange={this.handleInputChange}
            placeholder="Search Keyword"
          /> */}

          <TextField
            label="Search Task"
            margin="dense"
            name="keyword"
            onChange={this.handleInputChange}
            variant="outlined"
            className="searchBar"
          />
        </div>
      </Paper>
    );
  }
}

export default TodoList;
