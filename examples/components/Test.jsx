import React from 'react';
import {Button} from 'amis';

export default class TestComponent extends React.Component {
  render() {
    return (
      <div className="wrapper">
        <div className="m-b">
          <Button className="m-r-xs">按钮</Button>

          <Button className="m-r-xs" level="primary">
            按钮
          </Button>

          <Button className="m-r-xs" level="secondary">
            按钮
          </Button>

          <Button className="m-r-xs" level="success">
            按钮
          </Button>

          <Button className="m-r-xs" level="info">
            按钮
          </Button>

          <Button className="m-r-xs" level="warning">
            按钮
          </Button>

          <Button className="m-r-xs" level="danger">
            按钮
          </Button>

          <Button className="m-r-xs" level="light">
            按钮
          </Button>

          <Button className="m-r-xs" level="dark">
            按钮
          </Button>
        </div>

        <div className="m-b">
          <Button className="m-r-xs" size="xs">
            按钮
          </Button>
          <Button className="m-r-xs" size="sm">
            按钮
          </Button>
          <Button className="m-r-xs" size="md">
            按钮
          </Button>
          <Button className="m-r-xs" size="lg">
            按钮
          </Button>
        </div>

        <div className="m-b">
          <Button className="m-r-xs">
            <i className="fa fa-cloud" />
            <span>按钮</span>
          </Button>
          <Button className="m-r-xs">
            <span>按钮</span>
            <i className="fa fa-cloud" />
          </Button>
          <Button className="m-r-xs" iconOnly>
            <i className="fa fa-cloud" />
          </Button>
        </div>
      </div>
    );
  }
}
