import "./TodoList.css";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  SortByAlpha as SortByAlphaIcon,
} from "@material-ui/icons";
import {
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import React, { Component } from "react";

import localforage from "localforage";

// import FlipMove from "react-flip-move";

const LOCAL_STORAGE_KEY = "TODO_LIST";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

class TodoList extends Component {
  state = {
    items: [],
    keyword: "",
    isSorted: undefined,
    taskValue: "",
    isEditing: {},
    editedValue: "",
    isChecked: {},
  };

  componentDidMount() {
    localforage
      .getItem(LOCAL_STORAGE_KEY)
      .then((list = []) => this.setState({ items: list || [] }))
      .catch(console.error);
  }

  getItemStyle = (draggableStyle) => ({
    userSelect: "none",
    ...draggableStyle,
  });

  handleOnDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    this.setState(
      {
        items: items,
      },
      this.handleUpdateIndexDB
    );
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
    // e.stopPropagation();
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
        checked: false,
      };

      this.setState(
        (prevState) => ({
          items: [newItem, ...prevState.items],
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
    this.handleSort();
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
          className: item.checked ? "lineThrough" : "",
        }}
        secondary={item.checked && "Completed !"}
      />
    );
  };

  editTodoValue = (e) => {
    this.setState({
      editedValue: e.target.value,
    });
  };

  onCheckBox = ({ key }, event) => {
    this.setState({ isChecked: { [key]: true } });

    const { checked } = event.target;

    this.setState((prevState) => {
      const newItems = [...prevState.items];
      const index = newItems.findIndex((item) => item.key === key);

      if (index > -1) {
        newItems[index].checked = checked;
      }
      return newItems;
    }, this.handleUpdateIndexDB);
  };

  handleSort = () => {
    let { items, isSorted } = this.state;

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
  };

  renderItems = () => {
    let { items } = this.state;
    const { keyword } = this.state;
    if (keyword) {
      items = items.filter((item) => item.text.includes(keyword));
    }

    return items.map((item, idx) => (
      <Draggable key={item.key} draggableId={`${item.key}`} index={idx}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={this.getItemStyle(provided.draggableProps.style)}
          >
            <ListItem disableGutters key={item.key}>
              <ListItemIcon>
                <Checkbox
                  checked={item.checked || false}
                  onChange={(event) => this.onCheckBox(item, event)}
                  color="primary"
                />
              </ListItemIcon>
              {this.condRender(item)}
              <ListItemSecondaryAction>
                <IconButton
                  onClick={(e) => this.handleEditStateChange(e, item)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => this.handleDeleteItem(item)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </div>
        )}
      </Draggable>
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
          <DragDropContext onDragEnd={(result) => this.handleOnDragEnd(result)}>
            <Droppable droppableId="droppable">
              {(provided) => (
                <List {...provided.droppableProps} ref={provided.innerRef}>
                  {provided.placeholder}
                  <ul className="theList">
                    {/* <FlipMove duration={250} easing="ease-out"> */}
                    {this.renderItems()}
                    {/* </FlipMove> */}
                  </ul>
                </List>
              )}
            </Droppable>
          </DragDropContext>
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
